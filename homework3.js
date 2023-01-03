/*
 * Igor Alyeksyeyenko ia22016
 */

function capitalize(str) { // implement a function to capitalize the first letter of every word in str 
	if (typeof str == 'string' && str.length > 0) {
		let words = str.split(' ');
		for (let word in words) {
			words[word] = words[word][0].toUpperCase() + words[word].substring(1, words[word].length);
		}

		return words.join(' ');
	}

	return str;
}

var lookup = {};
var regions;

window.addEventListener('DOMContentLoaded', (event) => { // execute the code when the initial HTML document has been completely loaded, we need the regions select to be loaded 
	for (let i in activities) { // for every item in the activities - every piece of statistic info
		let region;
		if (activities[i].Location.ParentId)
			region = capitalize(activities[i].Location.ParentId); // read region from an activity
		else
			region = capitalize(activities[i].Location.Id); // read polling station Id from an activity
		let station = activities[i].Location.Name; // read polling station from an activity
		if (region && !(region in lookup)) { // if the region hasn't been previously processed
			lookup[region] = {}; // add a new region to the lookup
		}
		lookup[region][station] = 1; // add a station to the lookup. lookup is a two-dimensional associative array/object
	}

	// console.log(lookup); // uncomment this line if you want to see the result in the console


	// now let's get regions for the first select element
	regions = Object.keys(lookup).sort(); // get the list of keys in the lookup and sort it

	// console.log(regions); // uncomment this line if you want to see the result in the console

	var region_s = document.getElementById("region-list"); // get region select element
	for (let i in regions) { // for every region
		let opt = document.createElement('option'); // create a new option		
		opt.innerHTML = regions[i]; // fill the text with the region name
		opt.value = regions[i]; // fill the value with the region name
		region_s.appendChild(opt); // add newly created option to the region select
	}

	// to get polling stations for the first region and sort it
	var stations = Object.keys(lookup[regions[0]]).sort(); // if you need to process polling stations in the loop, use loop counter instead of index 0

	//console.log(stations); // uncomment this line if you want to see the result in the console

	// write your code to fill the polling stations select element
	document.getElementById('region-list').addEventListener('change', setPollStations);
	document.getElementById("show-stats").addEventListener('click', displayStats);

	//run it once
	setPollStations();
});

function createSimpleElement(type, text = "", textPostfix = "") {
	let element = document.createElement(type);

	if (text != "" && text != undefined)
		element.innerHTML = text + textPostfix;

	return element;
}

function generateTableHeader() {
	let headerRow = document.createElement('tr');
	let headerRegion = createSimpleElement('th', 'Region');
	let headerName = createSimpleElement('th', "Name");
	let headerAddress = createSimpleElement('th', "Address");
	let headerTotalVoters = createSimpleElement('th', "Total Voters");

	headerRow.append(
		headerRegion,
		headerName,
		headerAddress,
		headerTotalVoters,
	);

	if (document.getElementById("voterCount").checked) {
		let headerVoteCount = createSimpleElement('th', "Vote Count");
		let headerPercentVoted = createSimpleElement('th', "Percentage Voted");

		headerRow.append(headerVoteCount, headerPercentVoted);
	}
	if (document.getElementById("electionDayVoterCount").checked) {
		let headerElectionDayVoteCount = createSimpleElement('th', "Election Day Vote Count");
		let headerPercentVotedOnElectionDay = createSimpleElement('th', "Percentage Voted on Election Day");

		headerRow.append(headerElectionDayVoteCount, headerPercentVotedOnElectionDay);
	}
	return headerRow;
}

function displayStats(event) {
	let table = document.querySelector('#stat-table tbody');
	table.innerHTML = "";
	table.append(generateTableHeader());

	let selectedRegion = document.getElementById('region-list').value;
	let selectedStation = document.getElementById('polling-list').value;
	let votersFrom = -1;//assuming what needs to be tracked for votersFrom and votersUntil refers to the VoterCount(Total Voters in the table) field in the data itself
	let votersUntil = -1;//assuming what needs to be tracked for votersFrom and votersUntil refers to the VoterCount(Total Voters in the table) field in the data itself

	if (document.getElementById("vote-from").value != "" && document.getElementById("vote-from").checkValidity())
		votersFrom = document.getElementById("vote-from").value;
	if (document.getElementById("vote-until").value != "" && document.getElementById("vote-until").checkValidity())
		votersUntil = document.getElementById("vote-until").value;

	let regionData = getRegionData(regions.find(x => x == selectedRegion), selectedStation);

	for (var i = 0; i < regionData.length; i++) {
		if (regionData[i]?.TotalLocationStatistic?.Count)
			if ((votersFrom == -1 || regionData[i]?.Location.VoterCount >= votersFrom) &&
				(votersUntil == -1 || regionData[i]?.Location.VoterCount <= votersUntil) &&
				(document.getElementById("search").value == "" || regionData[i].Location.Name.toLowerCase().includes(document.getElementById("search").value.toLowerCase()))) {

				let row = document.createElement('tr');
				let rowRegionName = createSimpleElement('td', capitalize(regionData[i].Location.ParentId));
				let rowRegionStationName = createSimpleElement('td', regionData[i].Location.Name);
				let rowRegionStationAddress = createSimpleElement('td', regionData[i].Location.Address);
				let rowStationTotalVoters = createSimpleElement('td', regionData[i]?.Location.VoterCount);

				row.append(
					rowRegionName,
					rowRegionStationName,
					rowRegionStationAddress,
					rowStationTotalVoters,
				);

				if (document.getElementById("voterCount").checked) {
					let rowStationVoteCount = createSimpleElement('td', regionData[i]?.TotalLocationStatistic?.Count);
					let rowStationPercentageVoted = createSimpleElement('td', regionData[i]?.TotalLocationStatistic?.Percentage, "%");

					row.append(rowStationVoteCount, rowStationPercentageVoted);
				}
				if (document.getElementById("electionDayVoterCount").checked) {
					let rowElectionDayVoteCount = createSimpleElement('td', regionData[i]?.ElectionDayLocationVoteStatistic?.Count);
					let rowElectionDayPercentageVoted = createSimpleElement('td', regionData[i]?.ElectionDayLocationVoteStatistic?.Percentage, "%");

					row.append(rowElectionDayVoteCount, rowElectionDayPercentageVoted);
				}

				table.append(row);
			}
	}
}

function setPollStations(event) {
	let stationSelectElement = document.getElementById('polling-list');
	stationSelectElement.innerHTML = '';
	let option = document.createElement('option');
	option.innerHTML = "All";
	option.value = "";
	stationSelectElement.appendChild(option);
	if (event == undefined || event.target.value == "") {
		for (let region in regions)
			Object.keys(lookup[regions[region]]).forEach(poll => {
				let option = document.createElement('option');
				option.innerHTML = poll;
				option.value = poll;
				stationSelectElement.appendChild(option);
			});

	}
	else {
		let filteredLookup = lookup[event.target.value];
		for (let station in filteredLookup) {
			let option = document.createElement('option');
			option.innerHTML = station;
			option.value = station;
			stationSelectElement.appendChild(option);
		}
	}
}



function getRegionData(region, station) {
	let results = [];

	for (var i = 0; i < activities.length; i++)
		if (region == undefined || region.toLowerCase() == activities[i].Location.ParentId)
			if (station == "" || station == activities[i].Location.Name)
				results.push(activities[i]);

	return results;
}