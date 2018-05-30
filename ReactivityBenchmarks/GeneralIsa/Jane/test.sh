for i in {1..57}
do
	node JaneSlave 192.168.1.21 8000 $((i + 8006)) &
done