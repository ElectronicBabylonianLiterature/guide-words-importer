import {Command, flags} from '@oclif/command'
import {MongoClient} from 'mongodb'

class GuideWordsImporter extends Command {
  static description = 'describe the command here'

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    host: flags.string({char: 'h', description: 'MongoDB URI'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(GuideWordsImporter)

    const uri = flags.host || 'mongodb://localhost:27017'
    this.log(`Connecting to MongoDB ${uri}...`)

    if (args.file) {
      this.log(`you input --file: ${args.file}`)
    }

    const client = new MongoClient(uri, {useNewUrlParser: true})
    try {
      await client.connect()
      const collection = client.db('ebl').collection('fragments')
      await collection.updateOne({_id: 'K.1'}, {$set: {guideWord: '', oraccWords: []}})
      await client.close()
    } catch (error) {
      this.error(error)
    } finally {
      await client.close()
    }
  }
}

export = GuideWordsImporter
