npm run build
cp api/* ./build/
php -S localhost:3030 -t ./build/ &
firefox localhost:3030
