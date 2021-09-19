import {Command, flags} from '@oclif/command'
import chalk = require('chalk');
import {exec} from 'child_process'

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
      // TODO docker use context
      // TODO docker login azure --tentant-id ??
      exec('docker ps', (error, stdout, _stderr) => {
        console.log(chalk.blue(stdout))
      })
    }
  }
}

export = Bhg;
