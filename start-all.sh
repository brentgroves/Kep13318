#!/bin/bash
( node ~/srcnode/kors/MySql13318/app.js & node ~/srcnode/kors/Plex13318/app.js & node ~/srcnode/kors/Sproc13318/app.js & node ~/srcnode/kors/Alarms13318/app.js & node ~/srcnode/kors/Kep13318/app.js  )
