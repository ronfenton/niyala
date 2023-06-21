import { NextApiRequest, NextApiResponse } from 'next';
import { getGlobalDiscord } from '../../discord';
import { TextChannel } from 'discord.js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const discord = await getGlobalDiscord()
    const channel = discord.channels.cache.get('1120775031564275804') as TextChannel
    if (channel) {
      channel.send({content:`Via API: ${generate()}`})
      res.status(200).end();
      return;
    }
    console.error('Failed');
    res.status(500).end();
  } else {
    res.status(404).end();
  }
}


const species = [
  "Huvarin","Selaphae","Morazham","Ma'uzzur","Lyestran","Kashaskan","Taki-Ori"
];
const adjective = [
  "disgraced","retired","ex-corporate","desperate","anti-corporate", "gang-banger","ex-gang",
  "criminal", "moralistic", "augmented", "homeless","discredited", "secretive", "gifted",
  "talented","eccentric","proud","adventurous","risk-taking","cautious","underworld","promising",
  "young","experienced"
];
const role = [
  "street fighter", "doctor", "street racer", "hacker", "magician", "psion", "drone-master", "technician", "socialite",
  "brawler","professional","shooter","patriot","test-subject","medic","soldier","net-runner","thief",
  "manipulator","con artist","summoner","vagrant","entertainer","prostitute","cybernetics technician","scientist",
  "researcher","drone jockey","animal handler","beastmaster","street artist","scoundrel","rogue","priest",
  "detective","archer","sniper","marksman","wanna-be merc","lackey","engineer","demolitions expert",
  "armorer","boxer","martial artist","acrobat","lowlife","thug","hacker","activist","investigator",
  "reporter","swordsman","hunter","fencer","drunkard","jack-of-all-trades"
];
const activity = [
  "in hiding","laying low","supporting family","surviving","living in squalor",
  "keeping a low profile","avoiding corporate attention","getting by","making ends meet",
  "trying to find work","evading the law","looking for opportunity","seeking adventure",
  "hoping not to stay","hating life","recovering","residing","trying to keep their morality",
  "clawing for scraps","suffering","starving","working","failing"
];
const uniqueRole = [
  "discharged policeman","drone-replaced worker","fall-guy for a corporate scheme","wrongly-accused criminal",
  "mercenary in training","ex-corporate spy","government operative","enigma","unknown variable","untapped potential",
  "potential asset","remarkable individual","specialist","ex-corporate spider","ex-military combatant","displaced nomad"
]

const pickRandom = (arr:string[],allowNull:boolean) => {
  if(Math.random() <= 0.33 && allowNull) {return ""}
  const pick = Math.floor((Math.random()*arr.length))
  return arr[pick];
}

export const generate = () => {
  
  const line = ((Math.random() < 0.18) ? `${pickRandom(uniqueRole,false)} ${pickRandom(activity,true)}`
  : `${pickRandom(adjective,true)} ${pickRandom(species,true)} ${pickRandom(role,false)} ${pickRandom(activity,true)}`).trim().replace(/ +(?= )/g,'');

  return (`You are ${line.length>=0 ? (/[aeiou]/.test(line[0]) ? "an" : "a") : ""} ${line} in Megastructure B7`)
}