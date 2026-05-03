pipeline {
    agent any

    environment {
        DOCKER_USER = "seethanveshi"
    }

    stages {

        stage('Clone') {
            steps {
                git 'https://github.com/Seethanveshi-git/splitwise-micro-service-project.git'
            }
        }

        stage('Build Services') {
            steps {
                script {
                    def services = [
                        "service-registry",
                        "auth-service",
                        "group-service",
                        "expense-service",
                        "dashboard-service",
                        "api-gateway"
                    ]

                    for (service in services) {
                        echo "Building ${service}..."
                        dir(service) {
                            sh "mvn clean package -DskipTests"
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    def services = [
                        "service-registry",
                        "auth-service",
                        "group-service",
                        "expense-service",
                        "dashboard-service",
                        "api-gateway"
                    ]

                    for (service in services) {
                        echo "Building Docker image for ${service}..."
                        dir(service) {
                            sh "docker build -t ${service}:${BUILD_NUMBER} ."
                        }
                    }
                }
            }
        }

        stage('Tag Images') {
            steps {
                script {
                    def services = [
                        "service-registry",
                        "auth-service",
                        "group-service",
                        "expense-service",
                        "dashboard-service",
                        "api-gateway"
                    ]

                    for (service in services) {
                        sh """
                        docker tag ${service}:${BUILD_NUMBER} ${DOCKER_USER}/${service}:${BUILD_NUMBER}
                        docker tag ${service}:${BUILD_NUMBER} ${DOCKER_USER}/${service}:latest
                        """
                    }
                }
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER_VAR',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    sh '''
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER_VAR --password-stdin
                    '''

                    script {
                        def services = [
                            "service-registry",
                            "auth-service",
                            "group-service",
                            "expense-service",
                            "dashboard-service",
                            "api-gateway"
                        ]

                        for (service in services) {
                            sh """
                            docker push ${DOCKER_USER}/${service}:${BUILD_NUMBER}
                            docker push ${DOCKER_USER}/${service}:latest
                            """
                        }
                    }
                }
            }
        }
    }
}