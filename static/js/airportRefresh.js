golgotha.airportLoad = golgotha.airportLoad || {config:{doICAO:false, notVisited:false, useSched:true, dst:false, myRated:false, noCache:false}};
golgotha.airportLoad.config.clone = function() {
	let o = {};
	for (p in this) {
		if (this.hasOwnProperty(p))
			o[p] = this[p];
	}

	return o;
};

// Get Airport code out of select option
golgotha.airportLoad.config.getCode = function(opt) {
	if (!opt.airport) return opt.value.toUpperCase();
	return this.doICAO ? opt.airport.icao : opt.airport.iata;
};

// Helper functions to attach to airport/airline comboboxen
golgotha.airportLoad.setHelpers = function(combos, addSIDSTARHook) {
	if (combos == null) return false;
	combos = (combos instanceof Array) ? combos : [combos];
	combos.forEach(function(cb) {
		cb.massageSelects = function() { golgotha.airportLoad.massageSelects(cb); };
		cb.loadAirports = golgotha.airportLoad.loadAirports;
		cb.updateAirportCode = golgotha.airportLoad.updateAirportCode;
		cb.setAirport = golgotha.airportLoad.setAirport;
		cb.massageSelects(); cb.notVisited = false;
		if (addSIDSTARHook) cb.loadSIDSTAR = golgotha.airportLoad.loadSIDSTAR;	
	});
	return true;
};

golgotha.airportLoad.setText = function(combos) {
	if (combos == null) return false;
	combos = (combos instanceof Array) ? combos : [combos];
	combos.forEach(function(cb) {
		const txt = cb.form[cb.name + 'Code'];
		if (!txt) return false;
		cb.txt = txt;
	});
	return true;
};

golgotha.airportLoad.updateAirlineCode = function() {
	if (!this.txt) return false;
	const o = this.options[this.selectedIndex];
	this.txt.value = o.value;
	return true;
};

golgotha.airportLoad.updateAirportCode = function() {
	if (!this.txt) return false;
	const o = this.options[this.selectedIndex];
	this.txt.value = golgotha.airportLoad.config.getCode(o);
	return true;
};

golgotha.airportLoad.updateOrigin = function(combo) {
	let f = document.forms[0];
	let cfg = golgotha.airportLoad.config.clone();
	cfg.useSched = true; cfg.notVisited = combo.notVisited; cfg.dst = true;
	cfg.airline = golgotha.form.getCombo(f.airline);
	cfg.code = (combo.selectedIndex > 0) ? golgotha.form.getCombo(combo) : null;
	f.airportA.loadAirports(cfg);
	return true;
};

golgotha.airportLoad.setAirline = function(cb, sender, fireEvent) {
	let code = sender.value;
	if (code.length < 2) {
		var oldIdx = cb.selectedIndex; cb.selectedIndex = 0;
		if (fireEvent && cb.onchange && (oldIdx != 0)) cb.onchange();
		return true;
	}

	code = code.toUpperCase();
	for (var x = 0; x < cb.options.length; x++) {
		if (code == cb.options[x].value) {
			cb.selectedIndex = x;
			if (fireEvent && cb.onchange) cb.onchange();
			return true;
		}
	}

	sender.value = '';
	return false;
};

golgotha.airportLoad.setAirport = function(code, fireEvent, sender) {
	if (code == null) return false;
	if (code.length < 2) {
		let oldIdx = this.selectedIndex; this.selectedIndex = 0;
		if (fireEvent && this.onchange && (oldIdx != 0)) this.onchange();
		return true;
	}

	code = code.toUpperCase();
	for (var x = 0; x < this.options.length; x++) {
		let opt = this.options[x]; let ap = opt.airport || {};
		if ((code == opt.value) || (code == ap.icao) || (code == ap.iata)) {
			this.selectedIndex = x;
			if (fireEvent && this.onchange) this.onchange();
			return true;
		}
	}

	if (sender != null) sender.value = '';
	return false;
};

golgotha.airportLoad.setOptions = function(combo, data, opts) {
	combo.options.length = data.length + 1;
	combo.options[0] = new Option('-', '');
	let codeAttr = (opts.doICAO) ? 'icao' : 'iata';
	for (var i = 0; i < data.length; i++) {
		let a = data[i];
		let apCode = a[codeAttr];
		let opt = new Option(a.name + ' (' + apCode + ')', apCode);
		opt.airport = a;
		combo.options[i+1] = opt;
	}

	return true;
};

golgotha.airportLoad.loadAirports = function(opts)
{
const oldCode = golgotha.form.getCombo(this); let combo = this;
combo.disabled = true;
if (combo.txt) combo.txt.disabled = true;

const p = fetch('airports.ws?' + golgotha.util.createURLParams(opts), {signal:AbortSignal.timeout(5000)});
p.then(function(rsp) {
	if (!rsp.ok) return false;
	const o = combo.options[combo.selectedIndex];
	const oldCodes = ((o) && (o.airport)) ? [o.airport.iata, o.airport.icao] : [null];
	const isChanged = (oldCodes.indexOf(oldCode) < 0);
	rsp.json().then(function(js) {
		golgotha.airportLoad.setOptions(combo, js, opts);		
		combo.setAirport(oldCode, isChanged);
		combo.disabled = false;
		if (combo.txt) combo.txt.disabled = false;
		return true;		
	});
	
	return true;
});


return true;
};

golgotha.airportLoad.loadSIDSTAR = function(code, type)
{
const oldValue = golgotha.form.getCombo(this); let combo = this; combo.disabled = true;
const p = fetch('troutes.ws?airportD=' + code + '&airportA=' + code, {signal:AbortSignal.timeout(5000)});
p.then(function(rsp) {
	if (!rsp.ok) return false;
	rsp.json().then(function(js) {
		const jsData = js[type];
		combo.options.length = jsData.length + 1;
		combo.options[0] = new Option('-', '');
		for (var i = 0; i < trs.length; i++)
			combo.options[i+1] = new Option(trs[i].code, trs[i].code);
			
		golgotha.form.setCombo(combo, oldValue);
		combo.disabled = false;	
		return true;		
	});

	return true;	
});

return true;
};

golgotha.airportLoad.changeAirline = function(combos, opts) {
	combos.forEach(function(c) { c.loadAirports(opts); });
	golgotha.event.beacon('Airports', 'Change Airline');
	return true;
};

golgotha.airportLoad.massageSelects = function(root) {
	let opts = golgotha.util.getElementsByClass('airport', 'option', root);
	opts.forEach(function(op) { op.airport = {name:op.text, iata:op.getAttribute('iata'), icao:op.getAttribute('icao')}; });
	return opts.length;
};

golgotha.airportLoad.codeMassage = function() {
	let e = window.event;
	let c = e.which || e.keyCode;
	if (((c > 64) && (c < 91)) || ((c > 96) && (c < 123)))
		return true;

	return golgotha.event.stop(e);
};
