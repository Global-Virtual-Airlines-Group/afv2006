// Copyright 2005, 2006 Global Virtual Airlines Group. All Rights Reserved.
package net.afva.commands.main;

import org.deltava.commands.*;

/**
 * A Web Site Command to display the AFV home page.
 * @author Luke
 * @version 1.0
 * @since 1.0
 */

public class HomeCommand extends org.deltava.commands.main.HomeCommand {

	/**
	 * Executes the command.
	 * @param ctx the Command context
	 * @throws CommandException if an error occurs
	 */
	public void execute(CommandContext ctx) throws CommandException {
		
		// Execute the superclass
		super.execute(ctx);

		// Get Command result and override the JSP
		CommandResult result = ctx.getResult();
		result.setURL("/jsp/main/afvHome.jsp");
	}
}