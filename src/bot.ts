import TGBot from 'node-telegram-bot-api';
import fs from 'fs';
import process from 'node:process';
import { CockToken } from '../env/tokens';

(() => {
  const bot = new TGBot(CockToken, { polling: true });
  let cache: { cock: Record<string, number>, moba: Record<string, number> } = {
    cock: {},
    moba: {},
  }

  const ladderStars = ['🥇', '🥈', '🥉']

  fs.readFile('/home/essaenko/bot/cache.json', 'utf8', (error: Error, data: string): void => {
    if (error) {
      console.log('[ERROR] Reading cache: ', error);

      return;
    }

    try {
      const jsonCache = JSON.parse(data);

      Object.keys(jsonCache).forEach((key: string) => {
        cache[key as keyof typeof cache] = jsonCache[key];
      })
    } catch (e) {
      console.log('[ERROR] Corrupted cache file: ', e);
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

    console.log('New inline query from: ', query.from.username ?? ((query.from.first_name ?? '') + (query.from.last_name ?? '')))

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
    } else if (size > 5 && size <= 8) {
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
            `${index < 3 ? ladderStars[index] : '💩'} ${index + 1}: ${name} ${size}cm`)
          .join('\n')}${
            position > 9 ? 
              `\n...\n💩 ${position + 1}: ${username} ${size}cm` : 
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
            `${index < 3 ? ladderStars[index] : '💩'} ${index + 1}: ${name} ${chance}%`)
          .join('\n').replaceAll('_', '\\_').replaceAll('.','\\.')}${
            mobaPosition > 9 ? 
              `\n...\n💩 ${mobaPosition + 1}: ${username} ${chance}%` : 
              ''
            }`.replaceAll('_', '\\_').replaceAll('.','\\.') +
            `\n\n[Поддержать разработчика](https://www.donationalerts.com/r/essaenko)\n[Обсудить кок](https://t.me/flood_ru)`,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      },
    }], { cache_time: 0, is_personal: true }).catch((e) => {
      console.log('[ERROR] Cant send answer for query: ', query, username, e);
    });
  });

  const today1AM = new Date();
  today1AM.setHours(1, 0, 0, 0);

  const saveCache = () => {
    console.log('Saving cache', new Date())
    cache = {
      cock: {},
      moba: {},
    };

    console.log('Cache cleared');

    fs.writeFile('/home/essaenko/bot/cache.json', JSON.stringify(cache), (error) => {
      if (error) {
        console.log('[ERROR] Cant write cache file: ', error);
      } else {
        console.log('Cache file writted');
      }
    });

    const today1AM = new Date();
    today1AM.setHours(1, 0, 0, 0);

    setTimeout(saveCache, new Date(today1AM.getTime() + 1000 * 60 * 60 * 24).getTime() - Date.now());
    console.log('Next cache drop settled', new Date(today1AM.getTime() + 1000 * 60 * 60 * 24).getTime() - Date.now());
  }

  setTimeout(saveCache, new Date(today1AM.getTime() + 1000 * 60 * 60 * 24).getTime() - Date.now());
  console.log('Cache drop settled for:',new Date(today1AM.getTime() + 1000 * 60 * 60 * 24).getTime() - Date.now());

  setInterval(() => {
    console.log('Saving cache to file');
    fs.writeFile('/home/essaenko/bot/cache.json', JSON.stringify(cache), (error) => {
      if (error) {
        console.log('[ERROR] Cant write cache file: ', error);
      } else {
        console.log('Cache file writted', new Date());
      }
    })
  }, 1000 * 60 * 60);

  process.on('exit', (code: number) => {
    console.log('Process killed with code', code)
  });

  console.log('Bot working');
})()