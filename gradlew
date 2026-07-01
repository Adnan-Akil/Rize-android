#!/bin/sh
APP_NAME="Gradle"
APP_BASE_NAME=$(basename "$0")
APP_HOME=$(cd "$(dirname "$0")" && pwd -P)
CLASSPATH="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

set -e
unset CDPATH
if [ -n "$JAVA_HOME" ]; then
  JAVACMD="$JAVA_HOME/bin/java"
else
  JAVACMD="java"
fi
eval set -- $DEFAULT_JVM_OPTS "$JAVA_OPTS" "$GRADLE_OPTS" '-classpath' "$CLASSPATH" 'org.gradle.wrapper.GradleWrapperMain' "$@"
exec "$JAVACMD" "$@"
