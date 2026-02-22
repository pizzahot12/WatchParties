const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/jellyfin_out.json', 'utf8'));

let seriesMap = new Map();
(data.Items || []).forEach(item => {
    const itemType = item.Type || 'Movie';

    if (itemType === 'Episode') {
        const seriesId = String(item.SeriesId || `series-${item.Id}`);
        if (!seriesMap.has(seriesId)) {
            seriesMap.set(seriesId, { id: seriesId, title: 'Unknown Series', seasons: [] });
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
            seriesMap.set(sid, { id: sid, title: item.Name, seasons: [] });
        } else {
            seriesMap.get(sid).title = item.Name;
        }
    }
});

let without = Array.from(seriesMap.values()).filter(s => !s.seasons || s.seasons.length === 0);
console.log("Empty series count:", without.length);
without.forEach(s => console.log(s.title));
