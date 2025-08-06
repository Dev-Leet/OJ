# Use the official GCC (GNU Compiler Collection) image as the base.
# This provides a standard C++ compiler environment.
FROM gcc:latest

# Set the working directory inside the container to /usr/src/app.
# All subsequent commands will run from this directory.
WORKDIR /usr/src/app

# Copy the contents of the host directory (which will contain code.cpp and input.txt)
# into the container's working directory.
COPY . .

# Define the command to be executed when the container starts.
# This is a multi-step command run within a bash shell:
# 1. `g++ -o code code.cpp`: Compiles the C++ source file `code.cpp` and creates an executable file named `code`.
# 2. `&&`: If the compilation is successful (returns exit code 0), proceed to the next command.
# 3. `./code < input.txt`: Executes the compiled program `code` and redirects the content of `input.txt`
#    to the program's standard input (stdin).
CMD ["bash", "-c", "g++ -o code code.cpp && ./code < input.txt"]
