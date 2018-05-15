for i in {1..10}
do
	node RunUseCase2.js true monitor 300 qprop &
	node RunUseCase2.js true data 300 qprop &
	node RunUseCase2.js true config 300 qprop &
	node RunUseCase2.js true driving 300 qprop &
	node RunUseCase2.js true geo 300 qprop &
	node RunUseCase2.js true dash 300 qprop
	 sleep 5
done