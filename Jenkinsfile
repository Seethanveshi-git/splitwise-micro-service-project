pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "seethanveshi/auth-service"
    }

    stages {

        stage('Clone') {
            steps {
                git 'https://github.com/Seethanveshi-git/splitwise-micro-service-project.git'
            }
        }

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
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                    echo "Logging into Docker Hub..."
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin

                    echo "Pushing versioned image..."
                    docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}

                    echo "Pushing latest image..."
                    docker push ${DOCKER_IMAGE}:latest
                    '''
                }
            }
        }
    }
}