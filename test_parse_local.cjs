const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/jellyfin_out.json', 'utf8'));

let c_ep = 0, c_ser = 0, c_mov = 0, c_vid = 0, c_season = 0;
let fallout_id = null;

(data.Items || []).forEach(i => {
    if (i.Type === 'Series') {
        c_ser++;
        if (i.Name && i.Name.includes('Fallout')) fallout_id = i.Id;
    }
    else if (i.Type === 'Episode') c_ep++;
    else if (i.Type === 'Movie') c_mov++;
    else if (i.Type === 'Video') c_vid++;
    else if (i.Type === 'Season') c_season++;
});

console.log(`Series: ${c_ser}, Episodes: ${c_ep}, Movies: ${c_mov}, Videos: ${c_vid}, Seasons: ${c_season}`);
if (fallout_id) {
    const eps = data.Items.filter(i => i.SeriesId === fallout_id);
    console.log("Fallout episodes attached by SeriesId:", eps.length);
    if (eps.length > 0) {
        console.log("Sample episode ParentId:", eps[0].ParentId);
        console.log("Sample episode SeasonId:", eps[0].SeasonId);
    }
}
