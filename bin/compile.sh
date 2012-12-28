uglify="uglifyjs"
#uglify="cat"

rm -rf ../dist/crosslet-min.js
for f in `find ../lib/ -type f -name "*.js" | sort`
do
echo $f
cat $f | $uglify >> ../dist/crosslet-min.js
done

for f in `find ../src/ -type f -name "*.js" | sort`
do
echo $f
cat $f | $uglify >> ../dist/crosslet-min.js
done

coffee -cbp ../src/coffee/init.coffee | $uglify >> ../dist/crosslet-min.js
for f in `find ../src/ -type f -name "*.coffee" | sort | grep -v init.coffee`
do
echo $f
echo "coffee -cbp $f | $uglify"
coffee -cbp $f | $uglify >> ../dist/crosslet-min.js
done
