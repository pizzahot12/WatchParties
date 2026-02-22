const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/jellyfin_out.json', 'utf8'));

let f_items = [];
data.Items.forEach(i => {
    if (i.Name && i.Name.includes('Fallout')) f_items.push(i);
    else if (i.SeriesName && i.SeriesName.includes('Fallout')) f_items.push(i);
    else if (i.Id === '97ac79f1b1f01c246438b64d8b940be9' || i.SeriesId === '97ac79f1b1f01c246438b64d8b940be9') f_items.push(i);
});

f_items.forEach(i => console.log(i.Name, '-', i.Type, '-', i.Id));
