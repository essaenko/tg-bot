import TGBot from 'node-telegram-bot-api';
import fs from 'fs';
import process from 'node:process';
import { CockToken } from '../env/tokens';
import { errorLog, infoLog } from './utils';

(() => {
  const bot = new TGBot(CockToken, { polling: true });
  let cache: { cock: Record<string, number>, moba: Record<string, number> } = {
    cock: {},
    moba: {},
  }

  const ladderStars = ['🥇', '🥈', '🥉']

  fs.readFile('/home/essaenko/bot/cache.json', 'utf8', (error: Error, data: string): void => {
    if (error) {
      errorLog('Reading cache', error);

      return;
    }

    try {
      const jsonCache = JSON.parse(data);

      Object.keys(jsonCache).forEach((key: string) => {
        cache[key as keyof typeof cache] = jsonCache[key];
      })
    } catch (e) {
      errorLog('Corrupted cache file: ', e);
    }
  });

  bot.on('inline_query', (query) => {
    const username = query.from.username ?? ((query.from.first_name ?? '') + (query.from.last_name ?? ''));
    const standings = Object.entries(cache.cock).sort(([_, sizeA], [_1, sizeB]) => sizeB - sizeA)
    const mobaStandings = Object.entries(cache.moba).sort(([_, sizeA], [_1, sizeB]) => sizeB - sizeA)
    const ladder = standings.slice(0, 10);
    const mobaLadder = mobaStandings.slice(0, 10);
    const position = standings.findIndex(([name]) => name === username);
    const mobaPosition = mobaStandings.findIndex(([name]) => name === username);
    let size = Math.round(Math.random() * 45);
    let chance = Math.round(Math.random() * 100);
    let emoji = '';

    infoLog('New inline query from: ', query.from.username ?? ((query.from.first_name ?? '') + (query.from.last_name ?? '')))

    if (cache.moba[username] != null) {
      chance = cache.moba[username];
    }

    if (cache.cock[username] != null) {
      size = cache.cock[username];
    }
    cache.cock[username] = size;
    cache.moba[username] = chance;

    if (size <= 5) {
      emoji = '🤏';
    } else if (size > 5 && size <= 10) {
      emoji = '🫛';
    } else if (size > 10 && size <= 15) {
      emoji = '👩'
    } else if (size > 15 && size <= 25) {
      emoji = '🌽';
    } else if (size > 25 && size <= 30) {
      emoji = '🍆';
    } else if (size > 30 && size <= 40) {
      emoji = '🔥'
    } else {
      emoji = '👨🏿‍🦱';
    }

    bot.answerInlineQuery(query.id, [{
      id: query.id + `_${Math.round(Math.random() * 10000)}`,
      type: 'article',
      title: 'Cock size',
      input_message_content: {
        message_text: `Мой кок: ${emoji}${size}см`
      },
    }, 
    {
      id: query.id + `_${Math.round(Math.random() * 10000)}`,
      type: 'article',
      title: 'Шанс мобилизации',
      input_message_content: {
        message_text: `Шанс моей мобилизации: *${chance}%*`,
        parse_mode: 'MarkdownV2'
      },
    },{
      id: query.id + `_${Math.round(Math.random() * 10000)}`,
      type: 'article',
      title: 'Ladder',
      input_message_content: {
        message_text: `Ladder:\n${
          ladder.map(([name, size], index) => 
            `${index < 3 ? ladderStars[index] : '💩'} ${index + 1}: ${name === username ? `👉 *${name}*` : name} ${size}cm`)
          .join('\n')}${
            position > 9 ? 
              `\n...\n💩 ${position + 1}: 👉 *${username}* ${size}cm` : 
              ''
            }`.replaceAll('_', '\\_').replaceAll('.','\\.') +
            `\n\n[Поддержать разработчика](https://www.donationalerts.com/r/essaenko)\n[Обсудить кок](https://t.me/flood_ru)`,
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
      },
    }, {
      id: query.id + `_${Math.round(Math.random() * 10000)}`,
      type: 'article',
      title: 'Moba Ladder',
      input_message_content: {
        message_text: `Moba Ladder:\n${
          mobaLadder.map(([name, chance], index) => 
            `${index < 3 ? ladderStars[index] : '💩'} ${index + 1}: ${name === username ? `👉 *${name}*` : name} ${chance}%`)
          .join('\n').replaceAll('_', '\\_').replaceAll('.','\\.')}${
            mobaPosition > 9 ? 
              `\n...\n💩 ${mobaPosition + 1}: 👉 *${username}* ${chance}%` : 
              ''
            }`.replaceAll('_', '\\_').replaceAll('.','\\.') +
            `\n\n[Поддержать разработчика](https://www.donationalerts.com/r/essaenko)\n[Обсудить кок](https://t.me/flood_ru)`,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      },
    }], { cache_time: 0, is_personal: true }).catch((e) => {
      errorLog(`Can't send answer for query: `, query, username, e)
    });
  });

  bot.on('message', (message): void => {
    if (message.from.username === 'essaenko') {
      const command = message.entities?.find(({ type }) => type === 'bot_command');

      if (command) {
        switch(message.text.slice(command.offset, command.length)) {
          case '/get_cock_list': {
            bot.sendMessage(message.chat.id, Object.entries(cache.cock).map(([name, size]) => `${name}: ${size}`).join('\n'));

            break;
          }
          case '/get_moba_list': {
            bot.sendMessage(message.chat.id, Object.entries(cache.moba).map(([name, chance]) => `${name}: ${chance}`).join('\n'));

            break;
          }
          case '/set_cock_size': {
            const [_, user, size] = message.text?.split(' ');
            if (!Number.isNaN(+size)) {
              cache.cock[user] = +size;

              bot.sendMessage(message.chat.id, `Cock ${size}cm is settled for ${user}: \n ${
                Object.entries(cache.cock).map(([name, size]) => `${name}: ${size}`).join('\n')
              }`);
              break;
            }
            bot.sendMessage(message.chat.id, 'NaN as size, fuck off!');

            break;
          }
          case '/set_moba_chance': {
            const [_, user, chance] = message.text?.split(' ');
            if (!Number.isNaN(+chance)) {
              cache.moba[user] = +chance;

              bot.sendMessage(message.chat.id, `Chance ${chance}% is settled for ${user}: \n ${
                Object.entries(cache.moba).map(([name, chance]) => `${name}: ${chance}`).join('\n')
              }`);

              break;
            }
            bot.sendMessage(message.chat.id, 'NaN as chance, fuck off!');

            break;
          }
        }
      }
    }
  })

  const today1AM = new Date();
  today1AM.setHours(1, 0, 0, 0);

  const dropCache = () => {
    infoLog('Clearing cache')

    cache = {
      cock: {},
      moba: {},
    };

    infoLog('Cache cleared');

    saveCache();

    const today1AM = new Date();
    today1AM.setHours(1, 0, 0, 0);

    setTimeout(dropCache, new Date(today1AM.getTime() + 1000 * 60 * 60 * 24).getTime() - Date.now());
    infoLog(`Next cache drop settled: ${new Date(today1AM.getTime() + 1000 * 60 * 60 * 24).getTime() - Date.now()}`);
  }

  const saveCache = () => {
    fs.writeFile('/home/essaenko/bot/cache.json', JSON.stringify(cache), (error) => {
      if (error) {
        errorLog(`Can't write cache file: `, error);
      } else {
        infoLog('Cache file writted')
      }
    });
  }

  setTimeout(dropCache, new Date(today1AM.getTime() + 1000 * 60 * 60 * 24).getTime() - Date.now());
  infoLog(`Cache drop settled for: ${new Date(today1AM.getTime() + 1000 * 60 * 60 * 24).getTime() - Date.now()}`);


  setInterval(() => {
    infoLog('Saving cache to file')
    saveCache();
  }, 1000 * 60 * 60);

  process.on('exit', (code: number) => {
    infoLog(`Process killed with code: ${code}`);
  });

  infoLog('Booted');
})()