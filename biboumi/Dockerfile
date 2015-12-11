FROM library/ubuntu:wily

RUN apt-get update
RUN LC_ALL=C DEBIAN_FRONTEND=noninteractive apt-get install -y cmake gcc libexpat1-dev uuid-dev libidn11-dev build-essential libc-ares-dev wget git

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /root/
COPY localhost.patch /root/localhost.patch

RUN mkdir -p .config/biboumi
RUN git clone git://git.louiz.org/biboumi.git biboumi-2.0
RUN patch biboumi-2.0/louloulibs/xmpp/xmpp_component.cpp localhost.patch
RUN cd ./biboumi-2.0 && cmake . && make

CMD ["/root/biboumi-2.0/biboumi"]
