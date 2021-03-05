const wiki = require('wikijs').default;
// const fs = require('fs');
 
wiki({ apiUrl: 'https://en.wikipedia.org/w/api.php' })
    .search('Cristiano Ronaldo')
    .then((data)=>{
        let page = data.results[0];
        wiki()
            .page(page)
            .then(page => {
                return page
            }).then( async (_data)=>{
                console.log(_data.raw.fullurl);
                let image = await _data.mainImage();
                console.log(image);
            });
    });

