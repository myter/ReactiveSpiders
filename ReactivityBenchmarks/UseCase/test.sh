for i in {1..10}
do
	node RunUseCase.js true monitor 2 qprop &
	node RunUseCase.js true data 2 qprop &
	node RunUseCase.js true config 2 qprop &
	node RunUseCase.js true driving 2 qprop &
	node RunUseCase.js true geo 2 qprop &
	node RunUseCase.js true dash 2 qprop
	 sleep 5
done