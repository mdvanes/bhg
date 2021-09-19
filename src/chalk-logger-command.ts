import { Command } from "@oclif/command";
import chalk = require("chalk");

abstract class ChalkLoggerCommand extends Command {
  logProcOutput(message: string): void {
    this.log(chalk.blue(message));
  }

  logStep(message: string): void {
    this.log(chalk.yellow(message));
  }

  logOk(message: string): void {
    this.log(chalk.bold.green(message));
  }

  logError(message: string): void {
    this.error(chalk.bold.red(message));
  }
}

export default ChalkLoggerCommand;
