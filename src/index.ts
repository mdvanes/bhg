import {Command, flags} from '@oclif/command'
import chalk = require('chalk');
import {exec as origExec} from 'child_process'
import {promisify} from 'util'
const exec = promisify(origExec)

class Bhg extends Command {
  static description = 'Azure toolkit';

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  };

  static args = [
    {name: 'pcom', description: 'pseudo command', options: ['ps']}, // TODO convert to multi command
  ];

  async run() {
    const {args, flags} = this.parse(Bhg)

    const name = flags.name ?? 'world'
    this.log(`hello ${name} from ./src/index.ts`)
    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`)
    // }
    if (args.pcom === 'ps') {
      this.log('try to ps remotely...')
      // TODO docker login azure --tentant-id ??
      // TODO docker context create cloudstudyAciContext
      // TODO docker context use cloudstudyAciContext
      // if this fails with "not found",
      // log: first create the cloudstudyAciContext.
      // If that fails, log: first login to azure with the tenant ID that can be found in portal.azure.com under Azure Active Directory

      const {stdout} = await exec('docker ps')
      console.log(chalk.blue(stdout))
    }
  }
}

export = Bhg;
