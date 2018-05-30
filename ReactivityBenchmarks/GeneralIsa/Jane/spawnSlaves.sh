for i in {1..$1}
do
	node JaneSlave $2 8000 $((i + 8006)) &
done