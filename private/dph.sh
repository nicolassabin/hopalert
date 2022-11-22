#!/bin/sh
#clear
#go to prepared
# cd /Users/Jullou/nodepreprod/hopalert
cd /Users/nsabin/nodepreprod/hopalert
ls 
#fetch code source
git pull
cp server.js /Users/nsabin/nodeproject/hopalert
cp *.json /Users/nsabin/nodeproject/hopalert
cp -r public/ /Users/nsabin/nodeproject/hopalert/public/
cd /Users/nsabin/nodeproject/hopalert
ls 

