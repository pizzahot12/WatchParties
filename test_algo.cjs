const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/jellyfin_out.json', 'utf8'));

let seriesMap = new Map();
(data.Items || []).forEach(item => {
    const itemType = item.Type || 'Movie';

    if (itemType === 'Episode') {
        const seriesId = String(item.SeriesId || `series-${item.Id}`);
        if (!seriesMap.has(seriesId)) {
            seriesMap.set(seriesId, { id: seriesId, seasons: [] });
        }
        const series = seriesMap.get(seriesId);
        const seasonNumber = item.ParentIndexNumber || 1;
        const seasonId = String(item.SeasonId || `season-${seriesId}-${seasonNumber}`);

        let season = series.seasons.find(s => s.id === seasonId);
        if (!season) {
            season = { id: seasonId, seasonNumber, episodes: [] };
            series.seasons.push(season);
        }
        season.episodes.push({ id: item.Id });
    } else if (itemType === 'Series') {
        const sid = String(item.Id);
        if (!seriesMap.has(sid)) {
            seriesMap.set(sid, { id: sid, seasons: [] });
        }
    }
});

let fallout_series = Array.from(seriesMap.values()).find(s => s.id === "0f2fc28ca6bb0b9e821e25e1fc4be2ad" || s.id === "c4d3ca669dc67de764e5c8e3ccfe3b9a"); // Need the exact id..

let fallout = null;
for (let [k, v] of seriesMap) {
    if (k === '86d9a0dffbe90040ed67a0a6cc364d9b') fallout = v;
}
console.log("Total series tracked:", seriesMap.size);
let with_seasons = Array.from(seriesMap.values()).filter(s => s.seasons && s.seasons.length > 0);
console.log("Series with seasons:", with_seasons.length);

