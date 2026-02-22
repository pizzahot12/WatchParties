const fs = require('fs');

async function testFetch() {
  const resp = await fetch("http://192.168.8.191:8096/Items?api_key=ca03fadd259d4c7b9bc54fa41a942a78&Recursive=true&IncludeItemTypes=Movie,Series,Episode,Video&Fields=Overview,Genres,PrimaryImageAspectRatio,BackdropImageTags,ImageTags&Limit=20000", {
    headers: { 'Accept': 'application/json' }
  });
  const data = await resp.json();
  const items = data.Items || [];

  let movies = 0;
  let series = 0;
  let ep = 0;
  let vid = 0;

  items.forEach(i => {
    if (i.Type === 'Movie') movies++;
    else if (i.Type === 'Series') series++;
    else if (i.Type === 'Episode') ep++;
    else if (i.Type === 'Video') vid++;
    else console.log("Other", i.Type);
  });

  console.log(`Total: ${items.length}`);
  console.log(`Movies: ${movies}, Series: ${series}, Episodes: ${ep}, Videos: ${vid}`);
}

testFetch();
