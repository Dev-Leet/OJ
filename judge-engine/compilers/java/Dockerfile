# Use a slim, official OpenJDK image as the base.
# This image includes the Java compiler (javac) and the Java Virtual Machine (java).
# We assume the main class will be named 'Main'.
FROM openjdk:11-jdk-slim

# Set the working directory inside the container to /usr/src/app.
WORKDIR /usr/src/app

# Copy the contents of the host directory (which will contain Main.java and input.txt)
# into the container's working directory.
COPY . .

# Define the command to be executed when the container starts.
# This is a multi-step command run within a bash shell:
# 1. `javac Main.java`: Compiles the Java source file `Main.java`, creating `Main.class`.
# 2. `&&`: If compilation is successful, proceed to the next command.
# 3. `java Main < input.txt`: Executes the compiled Java class `Main` and redirects the content
#    of `input.txt` to the program's standard input (stdin).
CMD ["bash", "-c", "javac Main.java && java Main < input.txt"]
