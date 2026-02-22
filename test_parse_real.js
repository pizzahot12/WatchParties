async function run() {
  try {
    const r = await fetch("http://192.168.8.191:8096/Items?api_key=ca03fadd259d4c7b9bc54fa41a942a78&Recursive=true&IncludeItemTypes=Movie,Series,Episode,Video&Fields=Overview,Genres,PrimaryImageAspectRatio,BackdropImageTags,ImageTags&Limit=20000");
    const data = await r.json();
    let c_seasons = 0;
    let fallout_id = null;
    let one_piece_id = null;
    let c_ep = 0, c_mov = 0, c_ser = 0, c_vid = 0;

    data.Items.forEach(i => {
      if (i.Type === 'Series') {
        c_ser++;
        if (i.Name.includes('Fallout')) fallout_id = i.Id;
        if (i.Name.includes('One Piece')) one_piece_id = i.Id;
      }
      else if (i.Type === 'Episode') c_ep++;
      else if (i.Type === 'Movie') c_mov++;
      else if (i.Type === 'Video') c_vid++;
      else if (i.Type === 'Season') c_seasons++;
    });

    console.log(`Series: ${c_ser}, Episodes: ${c_ep}, Movies: ${c_mov}, Videos: ${c_vid}, Seasons: ${c_seasons}`);

    // find episodes for Fallout
    let fall_eps = data.Items.filter(i => i.SeriesId === fallout_id);
    let op_eps = data.Items.filter(i => i.SeriesId === one_piece_id);

    console.log("Fallout episodes attached by SeriesId:", fall_eps.length);
    if (fallout_id && fall_eps.length === 0) {
      // Find based on ParentId or something?
      let fall_kids = data.Items.filter(i => i.ParentId === fallout_id || i.SeasonId === fallout_id);
      console.log("Fallout kids by ParentId/SeasonId:", fall_kids.length);
    }

    console.log("One Piece episodes:", op_eps.length);

  } catch (e) {
    console.error(e);
  }
}
run();
