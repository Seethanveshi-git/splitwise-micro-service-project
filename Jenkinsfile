pipeline {
agent any


environment {
    AWS_REGION = "ap-south-1"
    ECR_REGISTRY = "824033491491.dkr.ecr.ap-south-1.amazonaws.com"
}

stages {

    stage('Detect Changes') {
        steps {
            script {
                def changes = sh(
                    script: """
                    git diff --name-only HEAD~1 HEAD || echo "ALL"
                    """,
                    returnStdout: true
                ).trim()

                def services = [
                    "auth-service",
                    "group-service",
                    "expense-service",
                    "dashboard-service",
                    "api-gateway",
                    "service-registry"
                ]

                def changed = []

                if (changes == "ALL") {
                    changed = services
                } else {
                    services.each { s ->
                        if (changes.contains(s)) {
                            changed.add(s)
                        }
                    }
                }

                if (changed.isEmpty()) {
                    echo "No changes detected"
                    currentBuild.result = 'SUCCESS'
                    return
                }

                env.SERVICES = changed.join(',')
                echo "Changed services: ${env.SERVICES}"
            }
        }
    }

    stage('ECR Login') {
        steps {
            withCredentials([[
                $class: 'AmazonWebServicesCredentialsBinding',
                credentialsId: 'aws-creds'
            ]]) {
                sh """
                aws ecr get-login-password --region $AWS_REGION | \
                docker login --username AWS --password-stdin $ECR_REGISTRY
                """
            }
        }
    }

    stage('Build & Push') {
        steps {
            script {
                def services = env.SERVICES.split(',')
                def parallelStages = [:]

                services.each { svc ->
                    def service = svc.trim()

                    parallelStages[service] = {
                        dir(service) {

                            echo "Building ${service}"

                            sh "mvn clean package -DskipTests"

                            sh """
                            docker build -t ${ECR_REGISTRY}/${service}:${BUILD_NUMBER} .
                            docker push ${ECR_REGISTRY}/${service}:${BUILD_NUMBER}
                            """

                            // Cleanup to avoid disk issues
                            sh "docker system prune -af || true"
                        }
                    }
                }

                parallel parallelStages
            }
        }
    }

    stage('Update GitOps Repo') {
        steps {
            script {
                def services = env.SERVICES.split(',')

                withCredentials([string(credentialsId: 'github-token', variable: 'GIT_TOKEN')]) {

                    sh """
                    rm -rf manifests
                    git clone https://x-access-token:${GIT_TOKEN}@github.com/Seethanveshi-git/splitwise-k8s-manifests.git manifests
                    """

                    services.each { svc ->
                        def service = svc.trim()

                        if (fileExists("manifests/${service}/deployment.yaml")) {

                            sh """
                            sed -i "s|image: .*${service}.*|image: ${ECR_REGISTRY}/${service}:${BUILD_NUMBER}|g" \
                            manifests/${service}/deployment.yaml
                            """
                        } else {
                            echo "Skipping ${service}, deployment.yaml not found"
                        }
                    }

                    sh """
                    cd manifests
                    git config user.email "jenkins@local"
                    git config user.name "jenkins"

                    git add .
                    git commit -m "Update services to build ${BUILD_NUMBER}" || echo "No changes"
                    git push
                    """
                }
            }
        }
    }
}

}
