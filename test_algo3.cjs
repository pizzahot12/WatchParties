const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/jellyfin_out.json', 'utf8'));

let f_series;
let f_ep;

data.Items.forEach(i => {
    if (i.Type === 'Series' && i.Name.includes('Fallout')) f_series = i;
    if (i.Type === 'Episode' && i.SeriesName && i.SeriesName.includes('Fallout')) f_ep = i;
});

console.log("Series ID:", f_series ? f_series.Id : 'not found');
console.log("Episode SeriesId:", f_ep ? f_ep.SeriesId : 'not found');

if (f_ep) {
    console.log("Episode fully:", f_ep);
}
