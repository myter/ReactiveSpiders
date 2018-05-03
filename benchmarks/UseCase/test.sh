for i in {1..10}
do
	node RunUseCase.js  app  &
	node RunUseCase.js  data  &
	node RunUseCase.js  config  &
	node RunUseCase.js  driving &
	node RunUseCase.js  geo  &
	node RunUseCase.js  dash
	 sleep 5
done