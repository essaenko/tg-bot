const fs = require('fs');

fs.readFile('/home/essaenko/bot/cache.json', 'utf8', (error: Error, data: string) => {
    if (error) console.log('ERROR: ', error);

    console.log(JSON.parse(data));
})