// Copyright 2023 Global Virtual Airlines Group. All Rights Reserved.
package net.afva.beans.econ;

import org.deltava.beans.acars.RunwayDistance;
import org.deltava.beans.econ.*;
import org.deltava.beans.flight.*;

/**
 * An Elite program scorer for Air France / KLM.
 * @author Luke
 * @version 11.1
 * @since 11.0  
 */

public class FlyingBlueScorer extends EliteScorer {

	@Override
	public FlightEliteScore score(ScorePackage pkg, EliteLevel lvl) {
		FDRFlightReport ffr = pkg.getFlightReport();
		_score.setAuthorID(ffr.getAuthorID());
		
		// Calculate base miles, break out if needed
		if (score(ffr, lvl) == null) return null;
		
		// Calculate landing score bonus
		if (pkg.getRunwayA() instanceof RunwayDistance ra) {
			double ls = LandingScorer.score(ffr.getLandingVSpeed(), ra.getDistance());
			LandingRating lr = LandingRating.rate((int)ls);
			addBonus(125, "Acceptable Landing", (lr == LandingRating.ACCEPTABLE));
			addBonus(350, "Good Landing", (lr == LandingRating.GOOD));
		}

		
		// Calculate no acceleration bonus
		
		return _score;
	}

	@Override
	public FlightEliteScore score(FlightReport fr, EliteLevel lvl) {
		if (!canScore(fr)) return null;
		reset(fr.getID(), lvl);
		_score.setAuthorID(fr.getAuthorID());
		_score.setDistance(fr.getDistance());
		
		setBase(fr.getDistance(), fr.hasAttribute(FlightReport.ATTR_ACARS) ? "ACARS/XACARS/simFDR Base Miles" : "Base Miles");
		
		addBonus(Math.round(_score.getPoints() * lvl.getBonusFactor()), String.format("% Supplement", lvl.getName()), lvl.getBonusFactor() > 0f);
		return _score;
	}
}