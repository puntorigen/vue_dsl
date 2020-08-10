<map version="1.1.2">
<!-- Diagrama de Concepto DSL. Para ver este archivo use Creador Concepto DSL de http://www.creador.cl -->
<node CREATED="1593364757441" ID="ID_754025712" MODIFIED="1597067993359" TEXT="testchico">
<attribute_layout NAME_WIDTH="83" VALUE_WIDTH="161"/>
<attribute NAME="deploy" VALUE="local"/>
<node CREATED="1552681609586" FOLDED="true" ID="ID_861168397" MODIFIED="1597072643069" POSITION="left" TEXT="config">
<icon BUILTIN="desktop_new"/>
<icon BUILTIN="button_cancel"/>
<node CREATED="1552681609586" ID="ID_1162429478" MODIFIED="1552681609586" TEXT="aws">
<attribute_layout NAME_WIDTH="91" VALUE_WIDTH="291"/>
<attribute NAME="access" VALUE="AKIAI5W2ESZXF5QKH5XQ"/>
<attribute NAME="secret" VALUE="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"/>
</node>
<node CREATED="1567095818640" ID="ID_521087574" MODIFIED="1597068150647" TEXT="axios">
<attribute_layout NAME_WIDTH="65" VALUE_WIDTH="183"/>
<attribute NAME="local" VALUE="http://127.0.0.1:8081"/>
<attribute NAME="deploy" VALUE="http://api.dominio.com"/>
<attribute NAME="https" VALUE="true"/>
</node>
<node CREATED="1594052488237" ID="ID_1822846584" MODIFIED="1594052490270" TEXT="nuxt:title">
<node CREATED="1594052492512" ID="ID_780662534" MODIFIED="1597068137427" TEXT="DSL de muestra"/>
</node>
</node>
<node CREATED="1593365109324" FOLDED="true" ID="ID_1679802330" MODIFIED="1597072625073" POSITION="left" TEXT="store">
<icon BUILTIN="desktop_new"/>
<icon BUILTIN="button_cancel"/>
<node CREATED="1552681609587" FOLDED="true" HGAP="19" ID="ID_135262242" MODIFIED="1597068611221" TEXT="auth" VSHIFT="-26">
<attribute NAME="tipo" VALUE="local"/>
<attribute NAME="expire" VALUE="6"/>
<node CREATED="1552681609587" ID="ID_1606500276" MODIFIED="1593651777599" TEXT="access"/>
<node CREATED="1552681609587" ID="ID_1920818804" MODIFIED="1593651779444" TEXT="refresh"/>
<node CREATED="1552681609587" ID="ID_1039034619" MODIFIED="1593651783010" TEXT="expiry"/>
<node CREATED="1593651669094" ID="ID_903442234" MODIFIED="1593657589144" TEXT="setear">
<icon BUILTIN="help"/>
<attribute_layout NAME_WIDTH="47" VALUE_WIDTH="126"/>
<attribute NAME="params" VALUE="access,refresh,expiry"/>
<node CREATED="1552681609587" ID="ID_1178271537" MODIFIED="1593657744410" TEXT="modificar">
<icon BUILTIN="desktop_new"/>
<icon BUILTIN="bell"/>
<attribute_layout NAME_WIDTH="44" VALUE_WIDTH="154"/>
<attribute NAME="access" VALUE="**params.access**"/>
<attribute NAME="refresh" VALUE="**params.refresh**"/>
<attribute NAME="expiry" VALUE="**params.expiry**"/>
</node>
</node>
</node>
<node CREATED="1593665561257" FOLDED="true" ID="ID_416662917" MODIFIED="1594353597327" TEXT="info">
<attribute NAME="tipo" VALUE="local"/>
<attribute NAME="expire" VALUE="6"/>
<node CREATED="1593665719770" ID="ID_323157025" MODIFIED="1593665740474" TEXT="id"/>
<node CREATED="1593665589565" ID="ID_999321030" MODIFIED="1593665594138" TEXT="display_name"/>
<node CREATED="1593665608466" ID="ID_1365993729" MODIFIED="1593665612926" TEXT="public_url"/>
<node CREATED="1593665621680" ID="ID_299505911" MODIFIED="1593665650759" TEXT="user_api_url"/>
<node CREATED="1593665614439" ID="ID_1134888876" MODIFIED="1593665619328" TEXT="followers"/>
<node CREATED="1593665653590" ID="ID_1297251443" MODIFIED="1593665654923" TEXT="image"/>
<node CREATED="1594312248272" ID="ID_803592430" MODIFIED="1594312256390" TEXT="karaoke"/>
<node CREATED="1594312316515" ID="ID_921799579" MODIFIED="1594312318144" TEXT="sesion"/>
<node CREATED="1593665664962" ID="ID_1147377311" MODIFIED="1594312332014" TEXT="setear">
<icon BUILTIN="help"/>
<attribute_layout NAME_WIDTH="47" VALUE_WIDTH="381"/>
<attribute NAME="params" VALUE="id,name,external_url,user_api_url,followers,image,karaoke,sesion"/>
<node CREATED="1552681609587" ID="ID_1959075518" MODIFIED="1594312341917" TEXT="modificar">
<icon BUILTIN="desktop_new"/>
<icon BUILTIN="bell"/>
<attribute_layout NAME_WIDTH="88" VALUE_WIDTH="154"/>
<attribute NAME="id" VALUE="**params.id**"/>
<attribute NAME="display_name" VALUE="**params.name**"/>
<attribute NAME="public_url" VALUE="**params.external_url**"/>
<attribute NAME="user_api_url" VALUE="**params.user_api_url**"/>
<attribute NAME="followers" VALUE="**params.followers**"/>
<attribute NAME="image" VALUE="**params.image**"/>
<attribute NAME="karaoke" VALUE="**params.karaoke**"/>
<attribute NAME="sesion" VALUE="**params.sesion**"/>
</node>
</node>
<node CREATED="1594167929360" ID="ID_1574890236" MODIFIED="1594312260164" TEXT="toggle_karaoke">
<icon BUILTIN="help"/>
<node CREATED="1552681609587" ID="ID_442984296" MODIFIED="1594167962645" TEXT="modificar">
<icon BUILTIN="desktop_new"/>
<attribute_layout NAME_WIDTH="88" VALUE_WIDTH="154"/>
<attribute NAME="karaoke" VALUE="!karaoke"/>
</node>
</node>
</node>
<node CREATED="1594167905071" FOLDED="true" ID="ID_892361600" MODIFIED="1594345948969" TEXT="config">
<attribute NAME="tipo" VALUE="local"/>
<attribute NAME="expire" VALUE="6"/>
<node CREATED="1594216635094" ID="ID_1627329313" MODIFIED="1594216636011" TEXT="menu"/>
<node CREATED="1594167929360" ID="ID_335122674" MODIFIED="1594230133833" TEXT="toggle_menu">
<icon BUILTIN="help"/>
<node CREATED="1594216937854" ID="ID_1234931197" MODIFIED="1594216950408" TEXT="modificar">
<icon BUILTIN="desktop_new"/>
<attribute NAME="menu" VALUE="!menu"/>
</node>
</node>
</node>
</node>
<node CREATED="1593364960783" ID="ID_1527177429" MODIFIED="1597068044682" POSITION="right" TEXT="login">
<icon BUILTIN="gohome"/>
<attribute_layout NAME_WIDTH="60" VALUE_WIDTH="100"/>
<attribute NAME="class" VALUE="black"/>
<node CREATED="1594004763661" ID="ID_1790231652" MODIFIED="1597068073332" TEXT="margen">
<icon BUILTIN="idea"/>
<node CREATED="1594004675044" ID="ID_1557458253" MODIFIED="1597092661852" TEXT="centrar">
<icon BUILTIN="idea"/>
<node CREATED="1597068090897" ID="ID_340889188" MODIFIED="1597092667244" TEXT="Hola mundo!">
<icon BUILTIN="button_cancel"/>
</node>
<node CREATED="1593122861539" ID="ID_351965517" MODIFIED="1597094332265" TEXT="html:br">
<icon BUILTIN="idea"/>
</node>
<node CREATED="1593122861539" ID="ID_861842496" MODIFIED="1597094334686" TEXT="html:br">
<icon BUILTIN="idea"/>
</node>
</node>
</node>
<node CREATED="1593383033359" ID="ID_1933537114" MODIFIED="1597095302715" TEXT="html:v-footer">
<icon BUILTIN="idea"/>
<attribute_layout NAME_WIDTH="74" VALUE_WIDTH="100"/>
<attribute NAME=":style" VALUE="$variables.fondo"/>
<attribute NAME="height" VALUE="100"/>
<attribute NAME=":fixed" VALUE="true"/>
<node CREATED="1594005762741" ID="ID_1472918639" MODIFIED="1597095305618" TEXT="spacer">
<icon BUILTIN="idea"/>
<icon BUILTIN="button_cancel"/>
</node>
<node CREATED="1594005771247" ID="ID_592041341" MODIFIED="1597095305618" TEXT="flex">
<icon BUILTIN="idea"/>
<icon BUILTIN="button_cancel"/>
<attribute NAME="ancho" VALUE="70%"/>
<node CREATED="1594005783057" ID="ID_49252319" MODIFIED="1594005786574" TEXT="centrar">
<icon BUILTIN="idea"/>
<node CREATED="1594005100193" ID="ID_923953027" MODIFIED="1597068114095" TEXT="Otro texto de prueba">
<font ITALIC="true" NAME="SansSerif" SIZE="12"/>
<attribute NAME="color" VALUE="white"/>
<attribute NAME="class" VALUE="title"/>
<attribute NAME="grosor" VALUE="medium"/>
</node>
</node>
</node>
<node CREATED="1594005762741" ID="ID_1976167438" MODIFIED="1597095305618" TEXT="spacer">
<icon BUILTIN="idea"/>
<icon BUILTIN="button_cancel"/>
</node>
</node>
<node CREATED="1594004881822" FOLDED="true" ID="ID_1586770012" MODIFIED="1597072636491" TEXT="variables">
<icon BUILTIN="xmag"/>
<icon BUILTIN="button_cancel"/>
<node CREATED="1594004321947" ID="ID_71212592" MODIFIED="1594004328950" TEXT="fondo">
<icon BUILTIN="help"/>
<node CREATED="1564666068151" ID="ID_94606909" MODIFIED="1594004520461" TEXT="struct, respuesta">
<icon BUILTIN="desktop_new"/>
<attribute_layout NAME_WIDTH="133" VALUE_WIDTH="113"/>
<attribute NAME="backgroundColor" VALUE="#00D95A"/>
</node>
<node CREATED="1553565000664" ID="ID_678355206" MODIFIED="1564666600606" TEXT="responder &quot;**respuesta**&quot;">
<icon BUILTIN="desktop_new"/>
</node>
</node>
</node>
</node>
</node>
</map>
