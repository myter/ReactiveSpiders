for ((i=1;i<=$1;i++))
do
	node JaneSlave $2 8000 $((i + 8006)) &
done