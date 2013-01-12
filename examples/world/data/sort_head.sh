nn=`echo $1 | sed "s/....$//"`
echo $nn

cat $1 | head -n 1 > $nn
cat $1 | tail -n +2 | sort >> $nn
