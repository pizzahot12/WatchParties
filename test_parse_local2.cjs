const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/jellyfin_out.json', 'utf8'));

let fallout_id = null;
(data.Items || []).forEach(i => {
    if (i.Type === 'Series' && i.Name.includes('Fallout')) fallout_id = i.Id;
});

if (fallout_id) {
    const eps = data.Items.filter(i => i.SeriesId === fallout_id);
    console.log("Episodes:", eps.length);
    if (eps.length > 0) {
        console.log("Fallout [0] Type:", eps[0].Type);
        console.log("Fallout [0] ParentIndexNumber (Season num):", eps[0].ParentIndexNumber);
        console.log("Fallout [0] IndexNumber (Episode num):", eps[0].IndexNumber);
        console.log("Fallout [0] SeasonId:", eps[0].SeasonId);
        console.log("Fallout [0] SeasonName:", eps[0].SeasonName);
        console.log("Fallout [0] Title:", eps[0].Name);
        console.log("Fallout [0] Container:", eps[0].Container);
        console.log("Fallout [0] Overview:", eps[0].Overview ? 'yes' : 'no');
    }
}

// Find another popular series like One Piece
let op_id = null;
(data.Items || []).forEach(i => {
    if (i.Type === 'Series' && i.Name.includes('One Piece')) op_id = i.Id;
});
if (op_id) {
    const eps = data.Items.filter(i => i.SeriesId === op_id);
    console.log("\\nOne Piece Episodes:", eps.length);
    if (eps.length > 0) {
        console.log("OP [0] ParentIndexNumber:", eps[0].ParentIndexNumber);
        console.log("OP [0] IndexNumber:", eps[0].IndexNumber);
        console.log("OP [0] SeasonId:", eps[0].SeasonId);
        console.log("OP [0] SeasonName:", eps[0].SeasonName);
    }
}
