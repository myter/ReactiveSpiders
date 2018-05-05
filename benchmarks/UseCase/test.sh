for i in {1..10}
do
	node RunUseCaseApp.js  app  &
	node RunUseCaseApp.js  data  &
	node RunUseCaseApp.js  config  &
	node RunUseCaseApp.js  driving &
	node RunUseCaseApp.js  geo  &
	node RunUseCaseApp.js  dash
	 sleep 5
done