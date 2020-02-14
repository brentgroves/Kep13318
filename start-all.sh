#!/bin/bash
( cd ~/srcnode/kors/bpg-services && npm start & cd ~/srcnode/kors/React13318 && npm start & node ~/srcnode/kors/Kep13318/app.js & node ~/srcnode/kors/Plex13318/app.js & node ~/srcnode/kors/MySql13318/app.js  )
