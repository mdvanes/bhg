import { Command } from "@oclif/command";
import chalk = require("chalk");

abstract class ChalkLoggerCommand extends Command {
  logProcOutput(message: string): void {
    this.log(chalk.blue(message));
  }

  logOk(message: string): void {
    this.log(chalk.bold.green(message));
  }

  logError(message: string): void {
    this.error(chalk.bold.red(message));
  }
}

export default ChalkLoggerCommand;
