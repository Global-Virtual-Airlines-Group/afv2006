// Copyright 2023, 2024, 2025 Global Virtual Airlines Group. All Rights Reserved.
package net.afva.beans.econ;

import org.deltava.beans.acars.RunwayDistance;
import org.deltava.beans.econ.*;
import org.deltava.beans.flight.*;
import org.deltava.util.system.SystemData;

/**
 * An Elite program scorer for Air France / KLM.
 * @author Luke
 * @version 12.2
 * @since 11.0  
 */

public class FlyingBlueScorer extends EliteScorer {
	
	private static final int MAX_ACCEL_PCT = SystemData.getInt("econ.elite.maxAccelPct", 20);
	
	private static final int MIN_DISTANCE = 500;

	@Override
	public FlightEliteScore score(ScorePackage pkg, EliteLevel lvl) {
		FDRFlightReport ffr = pkg.getFlightReport();
		
		// Calculate base miles, break out if needed
		if (score(ffr, lvl) == null) return null;
		
		// Calculate landing score bonus
		if (pkg.getRunwayA() instanceof RunwayDistance ra) {
			double ls = LandingScorer.score(ffr.getLandingVSpeed(), ra.getDistance());
			LandingRating lr = LandingRating.rate((int)ls);
			addBonus(Math.round(ffr.getDistance() * 0.15f), "Acceptable Landing", (lr == LandingRating.ACCEPTABLE));
			addBonus(Math.round(ffr.getDistance() * 0.375f), "Good Landing", (lr == LandingRating.GOOD));
		}

		// Calculate minimal acceleration bonus
		if (ffr instanceof ACARSFlightReport afr) {
			int accTime = afr.getTime(2) + afr.getTime(4);
			long accPct = accTime * 100 / afr.getBlockTime().toSeconds();
			if (accPct < MAX_ACCEL_PCT) {
				addBonus(ffr.getDistance() / 2, String.format("Minimal Time Acceleration - %d%%", Long.valueOf(accPct)), true);
				_score.setDistance(Math.max(MIN_DISTANCE, ffr.getDistance()));
			} else {
				ffr.addStatusUpdate(0, HistoryType.ELITE, String.format("Time Acceleration %d%%, limiting Distance credit to %d%%", Long.valueOf(accPct), Long.valueOf(100 - accPct)));
				_score.setDistance(Math.max(MIN_DISTANCE, Math.round(ffr.getDistance() * (1f - (accPct / 2)))));
			}
			
			// Calculate on-time bonus
			addBonus(Math.round(ffr.getDistance() * 0.4f), "Early Arrival", (afr.getOnTime() == OnTime.EARLY));
			addBonus(Math.round(ffr.getDistance() * 0.15f), "On Time Arrival", (afr.getOnTime() == OnTime.ONTIME));
		}
		
		return _score;
	}

	@Override
	public FlightEliteScore score(FlightReport fr, EliteLevel lvl) {
		if (!canScore(fr)) return null;
		reset(fr.getID(), lvl);
		_score.setAuthorID(fr.getAuthorID());
		_score.setDistance(fr.getDistance());
		
		setBase(fr.getDistance(), fr.hasAttribute(Attribute.ACARS) ? "ACARS/XACARS/simFDR Base Miles" : "Base Miles");
		
		addBonus(Math.round(_score.getPoints() * lvl.getBonusFactor()), String.format("% Supplement", lvl.getName()), lvl.getBonusFactor() > 0f);
		return _score;
	}
}