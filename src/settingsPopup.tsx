import React from "react";
import update from "immutability-helper";
import { DragDropContext, DropResult, Droppable, Draggable } from "@react-forked/dnd";
import { v4 as uuidv4 } from "uuid";
import { Location } from "./types";
import config from "./config";
import Modal from "./modal";
import IconDelete from "./iconDelete";
import IconDragHandle from "./iconDragHandle";
import IconSearch from "./iconSearch";
import styles from "./settingsPopup.module.scss";

interface AutocompleteMatch
{
	description: string;
	place_id: string;
}

interface Props extends React.Props<any>
{
	initialLocations: Location[];
	onSave: (locations: Location[]) => void;
}

interface State
{
	locations: Location[];
	deletingLocationIdx: number | null;
	addLocationText: string;
	addLocationMatches: AutocompleteMatch[];
}

class SettingsPopup extends React.Component<Props, State>
{
	constructor(
		props: Props)
	{
		super(props);
		this.m_modal = React.createRef<Modal>();
		this.m_locationsElem = React.createRef<HTMLDivElement>();
		this.m_latitude = null;
		this.m_longitude = null;
		this.m_fetchingAddLocationText = "";
		this.m_googleSessionToken = "";

		this.state = {
			locations: [],
			deletingLocationIdx: null,
			addLocationText: "",
			addLocationMatches: [],
		};
	}

	render()
	{
		return (
			<Modal title="Settings" onShow={() => this.onModalShow()} onHide={() => this.onModalHide()} ref={this.m_modal}>
				<div className={styles.layout} onClickCapture={e => this.onRootClickCapture(e)}>
					<div className={styles.sectionHdr}>Locations</div>
					<div className={styles.locationSearch}>
						<input
							type="text"
							placeholder="Add location"
							spellCheck={false}
							value={this.state.addLocationText}
							onChange={e => this.onAddLocationTextChange(e)}
						/>
						<div className={styles.icon}>
							<IconSearch/>
						</div>
						<div className={styles.locationMatches}>
							{this.state.addLocationMatches.map((match, idx) =>
								<button
									className={styles.locationMatch}
									key={idx}
									onClick={e => this.onAddLocationMatchClick(e, match)}
								>
									{match.description}
								</button>
							)}
						</div>
					</div>
					{this.renderLocations()}
					<div className={styles.copyright}>
						Copyright 2020 Rand Scullard
					</div>
				</div>
			</Modal>
		);
	}
	
	private renderLocations()
	{
		return (
			<div ref={this.m_locationsElem}>
				<DragDropContext onDragEnd={result => this.onLocationDragEnd(result)}>
					<Droppable droppableId="locations">
						{provided => (
							<div 
								className={styles.locations}
								ref={provided.innerRef}
								{...provided.droppableProps}
							>
								{(this.state.locations.length > 0) ?
									this.state.locations.map((loc, idx) =>
										<Draggable draggableId={loc.name} index={idx} key={`${loc.name} ${idx}`}>
											{provided => (
												<div
													className={`${styles.location} ${(idx === this.state.deletingLocationIdx) ? styles.deleting : ""}`}
													ref={provided.innerRef}
													{...provided.draggableProps}
												>
													<div className={styles.locationItems}>
														<div className={styles.deleteButton}>
															<button onClick={e => this.setState({deletingLocationIdx: idx})}>
																<IconDelete/>
															</button>
														</div>
														<div className={styles.locationName}>
															{loc.name}
														</div>
														<div className={styles.dragHandle} {...provided.dragHandleProps}>
															<IconDragHandle/>
														</div>
														<div className={styles.deleteConfirmButton}>
															<button onClick={e => this.onDeleteConfirmButtonClick()}>
																Delete
															</button>
														</div>
													</div>
												</div>
											)}
										</Draggable>
									)
								:
									<div className={styles.noLocations}>(no locations added)</div>
								}
								{provided.placeholder}
							</div>
						)}
					</Droppable>
				</DragDropContext>
			</div>
		);
	}

	private onModalShow()
	{
		this.m_fetchingAddLocationText = "";
		this.m_googleSessionToken = "";

		// Grab the geolocation of the user's device. We do this on modal show because the browser's
		// permission popup is less annoying now than if we wait until the user is in the middle of
		// looking up a location.
		this.getDeviceGeolocation();

		// Copy the initial list of locations into our state, so we don't modify the caller's copy when
		// the user manipulates the list.
		let locations = this.props.initialLocations.map(loc => ({
			name: loc.name,
			latitude: loc.latitude,
			longitude: loc.longitude,
			weather: null
		}));

		this.setState({
			locations: locations,
			deletingLocationIdx: null,
			addLocationText: "",
			addLocationMatches: [],
		});
	}

	private onModalHide()
	{
		// Fire the onSave event so the caller can update its copy of the list of locations.
		this.props.onSave(this.state.locations);
	}

	private onRootClickCapture(
		e: React.MouseEvent<HTMLDivElement, MouseEvent>)
	{
		// When the user has clicked a location's delete button but hasn't yet clicked the confirm delete button,
		// they're in "deleting" mode. In this case, clicking anything but the confirm delete button simply exits
		// "deleting" mode. We do this by listening for click events at the root element in "capture" phase
		// and cancelling a click on anything but the confirm delete button.
		if((this.state.deletingLocationIdx != null)
		&& !(e.target as HTMLElement).matches(`.${styles.deleteConfirmButton} *`))
		{
			e.stopPropagation();
			this.setState({deletingLocationIdx: null});
		}
	}

	private async onDeleteConfirmButtonClick()
	{
		// Delete the location and exit deleting mode...

		let newState = update(this.state, {
			deletingLocationIdx: { $set: null },
			locations: { $splice: [[this.state.deletingLocationIdx!, 1]] }
		});

		this.setState(newState);
	}

	private onLocationDragEnd(
		result: DropResult)
	{
		// If the user dropped the location outside the list of locations, do nothing.
		if(result.destination == null)
			return;

		// If the user dropped the location back at its original position, do nothing.
		if(result.destination.index === result.source.index)
			return;

		let movingLocation = this.state.locations[result.source.index];

		let newState = update(this.state, {
			locations: { $splice: [[result.source.index, 1], [result.destination.index, 0, movingLocation]] }
		});

		this.setState(newState);
	}

	private async onAddLocationTextChange(
		e: React.ChangeEvent<HTMLInputElement>)
	{
		// This code runs any time there is a change to the text in the "add location" textbox.

		// Remember the old content of the textbox.
		let prevAddLocationText = this.state.addLocationText;

		// Update state to reflect the new text, and wait until this completes.
		await new Promise<void>(resolve => this.setState({addLocationText: e.target.value}, () => resolve()));

		// If there is no change in the content (disregarding leading and trailing whitespace), there's nothing further to do.
		// (That is, there's no need to do a lookup for "New " if we're already displaying the matches for "New".)
		if(this.state.addLocationText.trim() === prevAddLocationText.trim())
			return;

		// If there is already a fetch in progress, we don't want to start another fetch; when the fetch already in progress
		// completes, it will detect the further change in the textbox and automatically start another fetch. This avoids
		// running multiple fetches at the same time.
		if(this.m_fetchingAddLocationText.length > 0)
			return;

		// There is new text in the textbox, and no fetch is in progress, so start a fetch.
		await this.fetchMatchingLocations();
	}
	
	private async fetchMatchingLocations(): Promise<void>
	{
		// The text to use in the fetch is the content of the texbox with no leading or trailing whitespace.
		this.m_fetchingAddLocationText = this.state.addLocationText.trim();

		// If there's no text to fetch then by definition there are no matches; clear out any existing matches and we're done.
		if(this.m_fetchingAddLocationText.length === 0)
		{
			this.setState({addLocationMatches: []});
			return;
		}

		try
		{
			// If the user gave us permission to use the device geolocation, then build the lat/long parameters to pass to the web service.
			// (If we don't have the geolocation, the web service will still work, but it will return results less relevant to the
			// user's current location. This is because it uses the caller's IP address to guess the location, and in practice this will be
			// the IP address of the proxy server used to make the call.)
			let latlong = "";
			if((this.m_latitude != null) && (this.m_longitude != null))
				latlong = `&location=${this.m_latitude},${this.m_longitude}&radius=1`;

			// Whenever we start a new autocomplete session with the web service, we use a new unique ID as the session token. This
			// ties the autocomplete and details calls together for billing purposes.
			// (See the topic on Session Tokens in the Google Places API documentation.)
			if(this.m_googleSessionToken === "")
				this.m_googleSessionToken = uuidv4();

			// Start a fetch for autocomplete matches for the text the user entered. Wait until it completes.
			let resp = await window.fetch(`${config.placeAutocompleteUrl}?sessiontoken=${this.m_googleSessionToken}&input=${this.m_fetchingAddLocationText}&types=geocode${latlong}`);

			// If, while the fetch was running, the user made a further change to the textbox, just throw away the results
			// of this fetch and start the whole thing over again.
			if(this.m_fetchingAddLocationText !== this.state.addLocationText.trim())
				return this.fetchMatchingLocations();

			// Store the returned matches in state so they can be displayed.
			let json = await resp.json();
			this.setState({addLocationMatches: json.predictions.map((pred: any) => ({description: pred.description, place_id: pred.place_id}))});

			// We're done fetching.
			this.m_fetchingAddLocationText = "";
		}
		catch(err: any)
		{
			this.m_fetchingAddLocationText = "";
			window.alert(err.message);
		}
	}

	private async onAddLocationMatchClick(
		e:     React.MouseEvent<HTMLButtonElement, MouseEvent>,
		match: AutocompleteMatch)
	{
		// This code runs whenever the user clicks one of the matches returned from the fetchMatchingLocations method.

		try
		{
			// Don't add the same location more than once.
			if(this.state.locations.findIndex(loc => loc.name === match.description) >= 0)
				throw new Error(`Location "${match.description}" is already in the list.`);

			// Call the Place Details web service to get the lat/long of the place selected by the user.
			// Use the same session token so this will be considered part of the same autocomplete "session" for billing purposes.
			let resp = await window.fetch(`${config.placeDetailsUrl}?sessiontoken=${this.m_googleSessionToken}&place_id=${match.place_id}&fields=geometry`);

			let json = await resp.json();

			// Build a location instance without any weather data.
			// (We'll fetch the weather data when the user first selects this location in the main UI.)
			let newLocation: Location = {
				name: match.description,
				latitude: json.result.geometry.location.lat,
				longitude: json.result.geometry.location.lng,
				weather: null
			};

			// Make sure we start a new session the next time the user looks up a location.
			this.m_googleSessionToken = "";

			// Reset the whole "add location" UI to blank, and add the new location to the end of the array of locations.
			let newState = update(this.state, {
				addLocationText: { $set: "" },
				addLocationMatches: { $set: [] },
				locations: { $push: [newLocation] }
			});

			this.setState(newState);
		}
		catch(err: any)
		{
			window.alert(err.message);
		}
	}

	private async getDeviceGeolocation()
	{
		// If getting the geolocation fails, these will be null.
		this.m_latitude = null;
		this.m_longitude = null;

		try
		{
			let position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(pos => resolve(pos), err => reject(err)));
			this.m_latitude = position.coords.latitude;
			this.m_longitude = position.coords.longitude;
		}
		catch(err: any)
		{
			window.alert(err.message);
		}
	}

	show()
	{
		this.m_modal.current!.show();
	}

	private m_modal: React.RefObject<Modal>;
	private m_locationsElem: React.RefObject<HTMLDivElement>;
	private m_latitude: number | null;
	private m_longitude: number | null;
	private m_fetchingAddLocationText: string;
	private m_googleSessionToken: string;
}

export default SettingsPopup;
