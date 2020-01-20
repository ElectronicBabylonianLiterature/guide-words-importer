import * as fs from 'fs'
import * as Papa from 'papaparse'
import {GuideWords} from './guide-words'

async function readFile(fileName: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => err ? reject(err) : resolve(data))
  })
}

function parseGuideWords(csv: string): readonly GuideWords[] {
  return Papa.parse(csv, {
    header: true,
  }).data
}

export async function parseFromFile(file: string): Promise<readonly GuideWords[]> {
  const csv = await readFile(file)
  return parseGuideWords(csv)
}

export function unparse(guideWords: GuideWords[]) {
  return Papa.unparse(guideWords)
}
