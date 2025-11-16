@echo off
echo ========================================
echo Checking Images Folder
echo ========================================
echo.

cd /d C:\BCCL\Arnab\AI\rdburman-tribute

echo Checking if public\images folder exists...
if exist "public\images\" (
    echo [OK] public\images folder exists
    echo.
    echo Listing image files:
    dir /b public\images\*.jpg public\images\*.png public\images\*.gif 2>nul
    echo.
    echo Total image files:
    dir /b public\images\*.jpg public\images\*.png public\images\*.gif 2>nul | find /c /v ""
) else (
    echo [ERROR] public\images folder does NOT exist!
    echo.
    echo Creating folder...
    mkdir public\images
    echo Folder created. Please add your images to: public\images\
)

echo.
echo ========================================
echo Testing API endpoint...
echo ========================================
curl http://localhost:3001/api/images/list

echo.
echo.
echo ========================================
echo If you see images listed above, they should work.
echo If no images, add some .jpg or .png files to public\images\
echo ========================================
pause