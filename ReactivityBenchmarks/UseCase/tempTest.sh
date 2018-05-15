for i in {1..10}
do
	node RunUseCase.js true monitor 300 qprop &
	node RunUseCase.js true data 300 qprop &
	node RunUseCase.js true config 300 qprop &
	node RunUseCase.js true driving 300 qprop &
	node RunUseCase.js true geo 300 qprop &
	node RunUseCase.js true dash 300 qprop
	 sleep 5
done