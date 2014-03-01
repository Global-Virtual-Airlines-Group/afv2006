// Copyright 2005, 2006, 2014 Global Virtual Airlines Group. All Rights Reserved.
package net.afva.commands.main;

import org.deltava.commands.*;

/**
 * A Web Site Command to display the AFV home page.
 * @author Luke
 * @version 5.3
 * @since 1.0
 */

public class HomeCommand extends org.deltava.commands.main.HomeCommand {

	/**
	 * Executes the command.
	 * @param ctx the Command context
	 * @throws CommandException if an error occurs
	 */
	@Override
	public void execute(CommandContext ctx) throws CommandException {
		super.execute(ctx);

		// Get Command result and override the JSP
		CommandResult result = ctx.getResult();
		if (result.getType() != ResultType.REDIRECT)
			result.setURL("/jsp/main/afvHome.jsp");
	}
}