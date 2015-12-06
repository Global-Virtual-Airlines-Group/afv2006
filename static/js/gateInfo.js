golgotha.gate = golgotha.gate || {gates:[],ourGates:[],isEdit:false,isDirty:[],data:[]};
golgotha.gate.icons = {ours:{pal:2,icon:56},intl:{pal:2,icon:48},pop:{pal:3,icon:52},other:{pal:3,icon:60}};
golgotha.gate.markDirty = function(id) { if (!golgotha.gate.isDirty.contains(id)) golgotha.gate.isDirty.push(id); };

golgotha.gate.load = function(id, forceReload)
{
var url = 'gates.ws?id=' + id;
if (forceReload == true)
	url += '&time=' + golgotha.util.getTimestamp(3000);

var xreq = new XMLHttpRequest();
xreq.open('get', url, true);
xreq.onreadystatechange = function() {
	if ((xreq.readyState != 4) || (xreq.status != 200)) return false;
	var jsData = JSON.parse(xreq.responseText);
	golgotha.gate.id = jsData.icao;
	jsData.gates.forEach(function(g) { golgotha.gate.data[g.id] = g; });
	golgotha.gate.reload();
	return true;
};

xreq.send(null);
return true;
};

golgotha.gate.reload = function() {
	golgotha.gate.gates.forEach(function(m) { google.maps.event.clearInstanceListeners(m); });
	golgotha.gate.ourGates.forEach(function(m) { google.maps.event.clearInstanceListeners(m); });
	map.removeMarkers(golgotha.gate.gates);
	map.removeMarkers(golgotha.gate.ourGates);
	golgotha.gate.gates = []; golgotha.gate.ourGates = [];
	golgotha.gate.data.keys().forEach(function(id) {
		var g = golgotha.gate.data[id]; var opts = golgotha.gate.icons.other;
		if (g.isIntl)
			opts = golgotha.gate.icons.intl;
		else if (g.isOurs)
			opts = golgotha.gate.icons.ours;
		else if (g.useCount > 0)
			opts = golgotha.gate.icons.pop;

		var mrk = new golgotha.maps.IconMarker({pal:opts.pal,icon:opts.icon,info:g.info}, g.pos);
		mrk.gateID = id;
		var dst = g.isOurs ? golgotha.gate.ourGates : golgotha.gate.gates;
		if (golgotha.gate.isEdit) {
			google.maps.event.addListener(mrk, 'dblclick', golgotha.gate.toggleOurs);
			if (g.isOurs)
				google.maps.event.addListener(mrk, 'rightclick', golgotha.gate.toggleIntl);
		}

		dst.push(mrk);
	});

	map.addMarkers(golgotha.gate.gates);
	map.addMarkers(golgotha.gate.ourGates);
	return true;
};

golgotha.gate.edit = function() {
	golgotha.gate.isEdit = true;
	golgotha.util.display('editLink', false);
	golgotha.util.display('helpText', true);
	golgotha.gate.reload();
	return true;
};

golgotha.gate.save = function()
{
var xreq = new XMLHttpRequest();
xreq.open('post', 'gateupdate.ws?id=' + golgotha.gate.id, true);
xreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
xreq.onreadystatechange = function() {
	if (xreq.readyState != 4) return false;
	if (xreq.status != 200) {
		alert('Error updating Gate Data!');
		return false;
	}

	golgotha.util.display('saveLink', false);
	golgotha.util.display('helpText', false);
	golgotha.gate.isDirty = [];
	return true;
};

// Convert associative array to object
var data = [];
golgotha.gate.isDirty.forEach(function(k) { var gd = golgotha.gate.data[k]; data.push({id:k,ours:gd.isOurs,intl:gd.isIntl}); });
golgotha.event.beacon('Schedule', 'Update Gates');
xreq.send('data=' + JSON.stringify(data));
return true;
};

golgotha.gate.toggleOurs = function() {
	var g = golgotha.gate.data[this.gateID];
	g.isOurs = !g.isOurs; g.isIntl &= g.isOurs;
	golgotha.gate.markDirty(this.gateID);
	golgotha.util.display('saveLink', true);
	golgotha.gate.reload();
	return true;
};

golgotha.gate.toggleIntl = function() {
	var g = golgotha.gate.data[this.gateID];
	g.isOurs = true; g.isIntl = !g.isIntl;
	golgotha.gate.markDirty(this.gateID);
	golgotha.util.display('saveLink', true);
	golgotha.gate.reload();
	return true;
};
