pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "seethanveshi/auth-service"
    }

    stages {

        stage('Build JAR') {
            steps {
                dir('auth-service') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('auth-service') {
                    sh 'docker build -t auth-service:${BUILD_NUMBER} .'
                }
            }
        }

        stage('Tag Image') {
            steps {
                sh '''
                docker tag auth-service:${BUILD_NUMBER} ${DOCKER_IMAGE}:${BUILD_NUMBER}
                docker tag auth-service:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'DockerHub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}
                    docker push ${DOCKER_IMAGE}:latest
                    '''
                }
            }
        }
    }
}