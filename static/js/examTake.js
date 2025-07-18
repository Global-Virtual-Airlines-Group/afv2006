golgotha.exam = golgotha.exam || {isExpired:false, rpInfo:[]};
golgotha.exam.getElementsById = function(id, eName)
{
let elements = [];
const all = document.getElementsByTagName((eName == null) ? '*' : eName);
for (var x = 0; x < all.length; x++) {
	if (all[x].id == id)
		elements.push(all[x]);
}

return elements;
};

golgotha.local.validate = function(f)
{
if (!golgotha.form.check()) return false;

// Check if all questions were answered
let isOK = true; let qNum = 1;
let a = golgotha.exam.getElementsById('A' + qNum);
while (isOK && (a.length > 0)) {
	if (a.length == 1)
		isOK = (isOK && (a[0].value.length > 1));
	else {
		let checkCount = 0;
		for (var x = 0; x < a.length; x++) {
			if (a[x].checked)
				checkCount++;
		}

		isOK = (isOK && (checkCount > 0));
	}

	qNum++;
	a = golgotha.exam.getElementsById('A' + qNum);
}

if ((!isOK) && (!document.isExpired))
	if (!confirm('You have not answered all Questions. Hit OK to submit.')) return false;

golgotha.form.submit(f);
return true;
};

golgotha.exam.getAnswer = function(txtbox)
{
if ((txtbox.length == 1) && (txtbox[0].value.length > 1))
	return txtbox[0].value;
else if (txtbox.length == 1)
	return null;

for (var x = 0; x < txtbox.length; x++) {
	if (txtbox[x].checked)
		return txtbox[x].value;
}
	
return null;
};

golgotha.exam.showRemaining = function(interval)
{
const now = new Date();
const tr = document.getElementById('timeRemaining');
const secondsLeft = (golgotha.exam.expiry - now.getTime() + golgotha.exam.timeOffset) / 1000;
if (!tr) return false;

// Update the text color
if (secondsLeft < 300)
	tr.className = 'error bld';
else if (secondsLeft < 600)
	tr.className = 'warn bld';

// Display the text and decrement the counter
tr.innerHTML = Math.floor(secondsLeft / 60) + ' minutes ' + Math.round(secondsLeft % 60) + ' seconds';

// If we're out of time, set a flag and submit
if (secondsLeft <= interval) {
	golgotha.exam.isExpired = true;
	document.forms[0].submit();
	return true;
}

return window.setTimeout(golgotha.exam.showRemaining, interval * 1000, interval);
};

golgotha.exam.saveAnswer = function(qNum, id)
{
const txtbox = golgotha.exam.getElementsById('A' + qNum);
if (!txtbox) return false;
if (txtbox.length == 1) {
	txtbox[0].oldBorder = txtbox[0].style.border;
	txtbox[0].style.border = '1px dashed #787980';
}

// Create the AJAX request
const xmlreq = new XMLHttpRequest();
xmlreq.open('POST', 'answer.ws?id=' + id + '&q=' + qNum + '&date=' + golgotha.util.getTimestamp(100));
xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
xmlreq.onreadystatechange = function() {
	if ((xmlreq.readyState != 4) || (xmlreq.status != 200)) return false;
	const time = parseInt(xmlreq.responseText);
	if (!isNaN(time)) secondsLeft = time;
	if (txtbox.length == 1) {
		txtbox[0].style.border = txtbox[0].oldBorder;
		delete txtbox[0].oldBorder;
	}

	return true;
};

// Save the answer
const answer = golgotha.exam.getAnswer(txtbox);
if (answer != null) {
	xmlreq.send('answer=' + encodeURI(answer));
	golgotha.event.beacon('Examination', 'Submit Answer');
}

return true;
};

golgotha.exam.viewImage = function(id, x, y)
{
var flags = 'height=' + (y+45) + ',width=' + (x+45) + ',menubar=no,toolbar=no,status=yes,scrollbars=yes';
return window.open('/dbimg/exam_rsrc/' + id, 'questionImage', flags);
};

golgotha.exam.updateMap = function(rpq)
{
const xmlreq = new XMLHttpRequest();
xmlreq.open('post', 'examplot.ws?id=' + rpq.examID + '&q=' + rpq.idx + '&date=' + golgotha.util.getTimestamp(100), true);
xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
var txtbox = golgotha.exam.getElementsById('A' + rpq.idx);
if (!txtbox) return false;
if (txtbox.length == 1) {
	txtbox[0].oldBorder = txtbox[0].style.border;
	txtbox[0].style.border = '1px dashed #787980';
}
	
// Build the update handler	
xmlreq.onreadystatechange = function() {
	if ((xmlreq.readyState != 4) || (xmlreq.status != 200)) return false;
	rpq.map.clearOverlays();

	// Draw the markers and load the codes
	let positions = [];
	let codes = [];
	const xdoc = xmlreq.responseXML.documentElement;
	var waypoints = xdoc.getElementsByTagName('pos');
	for (var i = 0; i < waypoints.length; i++) {
		var wp = waypoints[i];
		var label = wp.firstChild;
		var p = {lat:parseFloat(wp.getAttribute('lat')), lng:parseFloat(wp.getAttribute('lng'))};
		positions.push(p);
		codes.push(wp.getAttribute('code'));
		var mrk = null;
		if (wp.getAttribute('pal'))
			mrk = new golgotha.maps.IconMarker({pal:wp.getAttribute('pal'), icon:wp.getAttribute('icon'), info:label.data}, p);
		else
			mrk = new golgotha.maps.Marker({color:wp.getAttribute('color'), info:label.data}, p);

		mrk.setMap(rpq.map);
	}

	// Draw the route
	var rt = new google.maps.Polyline({path:positions, strokeColor:'#4080af', strokeWeight:1.65, strokeOpacity:0.8, geodesic:true, zIndex:golgotha.maps.z.POLYLINE});
	rt.setMap(rpq.map);

	// Save the codes
	if (txtbox.length == 1) {
		txtbox[0].value = codes.join(' ');
		txtbox[0].style.border = txtbox[0].oldBorder;
		delete txtbox[0].oldBorder;
	}

	return true;
};

xmlreq.send('route=' + encodeURI(getAnswer(txtbox)));
golgotha.event.beacon('Examination', 'Route Plot');
return true;
};
